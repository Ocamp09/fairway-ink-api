package services

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/ocamp09/fairway-ink-api/golang-api/config"
	"github.com/ocamp09/fairway-ink-api/golang-api/structs"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func newTestDesignServiceWithMock(bucket, host, outputPath string, mockS3 S3API) *DesignServiceImpl {
	return &DesignServiceImpl{
		Bucket:     bucket,
		Host:       host,
		OutputPath: outputPath,
		s3Client:   mockS3,
	}
}
type MockS3Client struct {
	mock.Mock
}

func (m *MockS3Client) ListObjectsV2(input *s3.ListObjectsV2Input) (*s3.ListObjectsV2Output, error) {
	args := m.Called(input)
	return args.Get(0).(*s3.ListObjectsV2Output), args.Error(1)
}


func TestListDesigns(t *testing.T) {
	tests := []struct {
		desc       string
		mockOutput *s3.ListObjectsV2Output
		mockErr    error
		expected   []structs.Design
		expectErr  bool
	}{
		{
			desc: "successfully returns structured designs",
			mockOutput: &s3.ListObjectsV2Output{
				Contents: []*s3.Object{
					{Key: aws.String("2024-06-01_design1_md.stl")},
					{Key: aws.String("2024-06-01_design1_lg.stl")},
					{Key: aws.String("2024-06-02_design2_sm.stl")},
					{Key: aws.String("README.md")}, // should be skipped
				},
			},
			mockErr: nil,
			expected: []structs.Design{
				{
					Name: "2024-06-01-design1",
					URLs: map[string]string{
						"md": "https://my-bucket.s3.us-east-1.amazonaws.com/2024-06-01_design1_md.stl",
						"lg":  "https://my-bucket.s3.us-east-1.amazonaws.com/2024-06-01_design1_lg.stl",
					},
				},
				{
					Name: "2024-06-02-design2",
					URLs: map[string]string{
						"sm": "https://my-bucket.s3.us-east-1.amazonaws.com/2024-06-02_design2_sm.stl",
					},
				},
			},
			expectErr: false,
		},
		{
			desc:       "returns error from s3 client",
			mockOutput: nil,
			mockErr:    assert.AnError,
			expected:   nil,
			expectErr:  true,
		},
	}

	config.S3_REGION = "us-east-1"

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			mockS3 := new(MockS3Client)
			mockS3.On("ListObjectsV2", mock.AnythingOfType("*s3.ListObjectsV2Input")).
				Return(tt.mockOutput, tt.mockErr)

			svc := newTestDesignServiceWithMock("my-bucket", "https://my-bucket", "./output", mockS3)

			result, err := svc.ListDesigns()

			if tt.expectErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expected, result)
			}
			mockS3.AssertExpectations(t)
		})
	}
}



func TestGetFilePath(t *testing.T) {
	tests := []struct {
		desc     string
		basePath string
		filename string
		ssid 	 string
		expected string
	}{
		{
			desc:     "Invalid filename, contains /",
			basePath: "/tmp/designs",
			filename: "/sample.svg",
			expected: "",
		},
		{
			desc:     "Invalid filename, contains \\",
			basePath: "/tmp/designs",
			filename: "\\sample.svg",
			expected: "",
		},
		{
			desc:     "Invalid filename, contains ..",
			basePath: "/tmp/designs",
			filename: "..sample.svg",
			expected: "",
		},
			{
			desc:     "Invalid ssid, contains /",
			basePath: "/tmp/designs",
			filename: "sample.svg",
			ssid: "123/",
			expected: "",
		},
		{
			desc:     "Invalid ssid, contains \\",
			basePath: "/tmp/designs",
			filename: "sample.svg",
			ssid: "123\\",
			expected: "",
		},
		{
			desc:     "Invalid ssid, contains ..",
			basePath: "/tmp/designs",
			filename: "sample.svg",
			ssid: "123..",
			expected: "",
		},
		{
			desc:     "returns correct full path",
			basePath: "/tmp/designs",
			filename: "sample.svg",
			expected: filepath.Join("/tmp/designs", "sample.svg"),
		},
			{
			desc:     "returns correct full path w/ ssid",
			basePath: "/tmp/designs",
			ssid: "123",
			filename: "sample.svg",
			expected: filepath.Join("/tmp/designs", "123", "sample.svg"),
		},
	}

    // Run invalid path tests
    for _, tt := range tests {
        t.Run(tt.desc, func(t *testing.T) {
            svc := NewDesignService(tt.basePath, "", tt.basePath)
            assert.Equal(t, tt.expected, svc.GetFilePath(tt.filename, tt.ssid))
        })
    }
}

func TestFileExists(t *testing.T) {
	tests := []struct {
		desc      string
		setupFile bool
		expect    bool
	}{
		{
			desc:      "returns true when file exists",
			setupFile: true,
			expect:    true,
		},
		{
			desc:      "returns false when file does not exist",
			setupFile: false,
			expect:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			basePath := t.TempDir()
			path := filepath.Join(basePath, "file.txt")

			if tt.setupFile {
				_ = os.WriteFile(path, []byte("test"), 0644)
			}

			svc := NewDesignService(basePath, "", "./output")
			assert.Equal(t, tt.expect, svc.FileExists(path))
		})
	}
}
