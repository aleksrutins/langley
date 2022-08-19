package main

import (
	"context"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
)

var ctx = context.Background()

func main() {
	_ = godotenv.Load()
	redisOpts, err := redis.ParseURL(os.Getenv("REDIS_URL"))
	if err != nil {
		println("Error parsing Redis URL")
		return
	}
	rdb := redis.NewClient(redisOpts)

	app := fiber.New()

	app.Use(cors.New())

	app.Get("/:user/:repo", func(c *fiber.Ctx) error {
		user := c.Params("user")
		repo := c.Params("repo")
		entry, err := rdb.Get(ctx, fmt.Sprintf("%s/%s", user, repo)).Result()
		if err != nil {
			res, err := http.Get(fmt.Sprintf("https://api.github.com/repos/%s/%s/languages", user, repo))
			if err == nil {
				bytes, err := ioutil.ReadAll(res.Body)
				if err == nil {
					entry = string(bytes)
					expiration, err := time.ParseDuration("24h")
					if err != nil {
						expiration = time.Duration(0)
					}
					rdb.Set(ctx, fmt.Sprintf("%s/%s", user, repo), entry, expiration)
				}
			}
		}
		if err == nil {
			return c.SendString(entry)
		} else {
			return errors.New("error fetching data")
		}
	})
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	app.Listen("0.0.0.0:" + port)
}
