package services

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/ocamp09/fairway-ink-api/golang-api/config"
	"github.com/ocamp09/fairway-ink-api/golang-api/structs"
)

type DesignServiceImpl struct {
	Bucket string
}

func NewDesignService(bucket string) DesignService {
	return &DesignServiceImpl{Bucket: bucket}
}

func (ds *DesignServiceImpl) ListDesigns() ([]structs.Design, error) {
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(config.S3_REGION),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create AWS session: %v", err)
	}

	s3Client := s3.New(sess)

	resp, err := s3Client.ListObjectsV2(&s3.ListObjectsV2Input{
		Bucket: aws.String(ds.Bucket),
		Prefix: aws.String(""), // optionally filter by prefix
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list objects: %v", err)
	}

	designMap := make(map[string]map[string]string) // name -> size -> url

	for _, item := range resp.Contents {
		key := *item.Key
		if !strings.HasSuffix(key, ".stl") {
			continue
		}

		base := filepath.Base(key)
		parts := strings.Split(base, "-")
		if len(parts) < 2 {
			continue // skip files not matching name-size.stl
		}

		name := strings.Join(parts[:len(parts)-1], "-")
		sizePart := strings.TrimSuffix(parts[len(parts)-1], ".stl")

		publicURL := fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", ds.Bucket, config.S3_REGION, key)

		if _, ok := designMap[name]; !ok {
			designMap[name] = make(map[string]string)
		}
		designMap[name][sizePart] = publicURL
	}

	var designs []structs.Design
	for name, urls := range designMap {
		designs = append(designs, structs.Design{
			Name: name,
			URLs: urls,
		})
	}

	return designs, nil
}

// GetPresignedURL returns a presigned URL to download a session-specific design
func (ds *DesignServiceImpl) GetPresignedURL(ssid, filename string) (string, error) {
	if ssid == "" || filename == "" {
		return "", fmt.Errorf("ssid or filename missing")
	}

	key := fmt.Sprintf("%s/%s", ssid, filename)

	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(config.S3_REGION),
	})
	if err != nil {
		return "", fmt.Errorf("failed to create AWS session: %v", err)
	}

	s3Client := s3.New(sess)
	req, _ := s3Client.GetObjectRequest(&s3.GetObjectInput{
		Bucket: aws.String(ds.Bucket),
		Key:    aws.String(key),
	})

	urlStr, err := req.Presign(15 * time.Minute)
	if err != nil {
		return "", fmt.Errorf("failed to presign URL: %v", err)
	}

	return urlStr, nil
}

func (ds *DesignServiceImpl) FileExists(path string) bool {
	_, err := os.Stat(path)
	return !os.IsNotExist(err)
}
