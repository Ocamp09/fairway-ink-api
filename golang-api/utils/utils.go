package utils

import "strings"

func SafeFilepathElement(elem string) bool {
	if strings.Contains(elem, "/") || strings.Contains(elem, "\\") || strings.Contains(elem, "..") {
		return false
	}

	return true
}