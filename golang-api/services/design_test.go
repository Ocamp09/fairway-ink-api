package services

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/ocamp09/fairway-ink-api/golang-api/config"
	"github.com/stretchr/testify/assert"
)

func TestListDesigns(t *testing.T) {
	originalPort := config.PORT
	originalEnv := config.APP_ENV
	defer func() {
		config.PORT = originalPort
		config.APP_ENV = originalEnv
	}()

	tests := []struct {
		desc      string
		setup     func(dir string)
		appEnv    string
		port      string
		expected  []string
		expectErr bool
	}{
		{
			desc: "successfully returns list of designs in non-prod env",
			setup: func(dir string) {
				_ = os.WriteFile(filepath.Join(dir, "design1_md.png"), []byte("data"), 0644)
				_ = os.WriteFile(filepath.Join(dir, "design2_md.jpg"), []byte("data"), 0644)
				_ = os.WriteFile(filepath.Join(dir, "other.txt"), []byte("data"), 0644)
			},
			appEnv: "dev",
			port:   "8000",
			expected: []string{
				"http://localhost:8000/designs/design1_md.png",
				"http://localhost:8000/designs/design2_md.jpg",
			},
			expectErr: false,
		},
		{
			desc: "successfully returns list of designs in prod env",
			setup: func(dir string) {
				_ = os.WriteFile(filepath.Join(dir, "design1_md.png"), []byte("data"), 0644)
				_ = os.WriteFile(filepath.Join(dir, "design2_md.jpg"), []byte("data"), 0644)
			},
			appEnv: "prod",
			port:   "443", // doesn't matter in prod path
			expected: []string{
				"https://example.com/designs/design1_md.png",
				"https://example.com/designs/design2_md.jpg",
			},
			expectErr: false,
		},
		{
			desc:      "returns error when directory does not exist",
			setup:     nil,
			appEnv:    "dev",
			port:      "8000",
			expected:  nil,
			expectErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			config.PORT = tt.port
			config.APP_ENV = tt.appEnv

			var basePath string
			if tt.setup != nil {
				basePath = t.TempDir()
				tt.setup(basePath)
			} else {
				basePath = "/nonexistent/path"
			}

			host := "https://example.com"
			if tt.appEnv != "prod" {
				host = "http://localhost:" + tt.port
			}

			svc := NewDesignService(basePath, host, "./output")
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
            svc := NewDesignService(tt.basePath, "", "")
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
