package services

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestListDesigns(t *testing.T) {
	tests := []struct {
		desc      string
		setup     func(dir string)
		expected  []string
		expectErr bool
	}{
		{
			desc: "successfully returns list of designs",
			setup: func(dir string) {
				_ = os.WriteFile(filepath.Join(dir, "design1_medium.png"), []byte("data"), 0644)
				_ = os.WriteFile(filepath.Join(dir, "design2_medium.jpg"), []byte("data"), 0644)
				_ = os.WriteFile(filepath.Join(dir, "other.txt"), []byte("data"), 0644)
			},
			expected: func() []string {
				if runtime.GOOS == "linux" {
					return []string{
						"https://example.com/designs/design1_medium.png",
						"https://example.com/designs/design2_medium.jpg",
					}
				}
				return []string{
					"http://localhost:5000/designs/design1_medium.png",
					"http://localhost:5000/designs/design2_medium.jpg",
				}
			}(),
			expectErr: false,
		},
		{
			desc:      "returns error when directory does not exist",
			setup:     nil,
			expected:  nil,
			expectErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			var basePath string
			if tt.setup != nil {
				basePath = t.TempDir()
				tt.setup(basePath)
			} else {
				basePath = "/nonexistent/path"
			}

			svc := NewDesignService(basePath, "https://example.com")
			designs, err := svc.ListDesigns()

			if tt.expectErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.ElementsMatch(t, tt.expected, designs)
			}
		})
	}
}

func TestGetFilePath(t *testing.T) {
	tests := []struct {
		desc     string
		basePath string
		filename string
		expected string
	}{
		{
			desc:     "returns correct full path",
			basePath: "/tmp/designs",
			filename: "sample.svg",
			expected: filepath.Join("/tmp/designs", "sample.svg"),
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			svc := NewDesignService(tt.basePath, "")
			assert.Equal(t, tt.expected, svc.GetFilePath(tt.filename))
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

			svc := NewDesignService(basePath, "")
			assert.Equal(t, tt.expect, svc.FileExists(path))
		})
	}
}
