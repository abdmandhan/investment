package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/reksadana/aum-go/internal/aum"
)

func main() {
	verify := flag.Bool("verify", false, "run verification only (no generation)")
	flag.Parse()

	dbURL := os.Getenv("URS_DATABASE_URL")
	if dbURL == "" {
		log.Fatal("URS_DATABASE_URL is required")
	}

	gen, err := aum.NewGenerator(dbURL)
	if err != nil {
		log.Fatalf("failed to create AUM generator: %v", err)
	}
	defer gen.Close()

	if *verify {
		if err := gen.Verify(); err != nil {
			log.Fatalf("verification failed: %v", err)
		}
		fmt.Println("Verification completed successfully.")
		return
	}

	if err := gen.Generate(); err != nil {
		log.Fatalf("AUM generation failed: %v", err)
	}
	fmt.Println("AUM generation completed successfully.")
}
