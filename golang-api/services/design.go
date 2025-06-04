package services

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/ocamp09/fairway-ink-api/golang-api/config"
	"github.com/ocamp09/fairway-ink-api/golang-api/structs"
)

type DesignServiceImpl struct {
	Bucket string
	Host string
	OutputPath string
}

func NewDesignService(bucket, host, outputPath string) DesignService {
	return &DesignServiceImpl{
		Bucket: bucket, 
		Host: host, 
		OutputPath: outputPath,
	}
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
			continue // skip files that are not stls
		}

		base := filepath.Base(key)
		parts := strings.Split(base, "_")
		if len(parts) < 3 {
			continue // skip files not matching date_name_size.stl
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

func (ds *DesignServiceImpl) GetFilePath(filename string, ssid string) string {
	return filepath.Join(ds.OutputPath, ssid, filename)
}

func (ds *DesignServiceImpl) FileExists(path string) bool {
	_, err := os.Stat(path)
	return !os.IsNotExist(err)
}
