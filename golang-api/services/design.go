package services

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/ocamp09/fairway-ink-api/golang-api/config"
	"github.com/ocamp09/fairway-ink-api/golang-api/utils"
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
		if !file.IsDir() && strings.Contains(file.Name(), "md") {
			url := fmt.Sprintf("%s/designs/%s", ds.Host, file.Name())

			if config.APP_ENV != "prod" {
				url = fmt.Sprintf("http://localhost:%s/designs/%s", config.PORT, file.Name())
			}
			urls = append(urls, url)
		}
	}
	return urls, nil
}

func (ds *DesignServiceImpl) GetFilePath(filename string, ssid string) string {
	// Validate filename & ssid
	if !utils.SafeFilepathElement(filename) || !utils.SafeFilepathElement(ssid){
		return ""
	}

	return filepath.Join(ds.BasePath, ssid, filename)
}

func (ds *DesignServiceImpl) FileExists(path string) bool {
	_, err := os.Stat(path)
	return !os.IsNotExist(err)
}