package services

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

type DesignServiceImpl struct {
	BasePath string
	Host     string
}

func NewDesignService(basePath string, host string) DesignService {
	return &DesignServiceImpl{BasePath: basePath, Host: host}
}

func (ds *DesignServiceImpl) ListDesigns() ([]string, error) {
	files, err := os.ReadDir(ds.BasePath)
	if err != nil {
		return nil, err
	}

	var urls []string
	for _, file := range files {
		if !file.IsDir() && strings.Contains(file.Name(), "medium") {
			url := fmt.Sprintf("%s/designs/%s", ds.Host, file.Name())

			if runtime.GOOS != "linux" {
				url = fmt.Sprintf("http://localhost:5000/designs/%s", file.Name())
			}
			urls = append(urls, url)
		}
	}
	return urls, nil
}

func (ds *DesignServiceImpl) GetFilePath(filename string) string {
	return filepath.Join(ds.BasePath, filename)
}

func (ds *DesignServiceImpl) FileExists(path string) bool {
	_, err := os.Stat(path)
	return !os.IsNotExist(err)
}