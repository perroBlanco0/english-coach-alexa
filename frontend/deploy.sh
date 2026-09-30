#!/usr/bin/env bash
# Syncs the built SPA (dist/) to the S3 bucket created by ../template.yaml
# and invalidates CloudFront so the new build is served immediately.
#
# Usage: ./deploy.sh [profile] [stack-name]
set -e
PROFILE="${1:-hackathon}"
STACK_NAME="${2:-english-coach-alexa}"
REGION="us-east-1"

BUCKET=$(aws cloudformation describe-stacks --profile "$PROFILE" --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" --output text)

DISTRIBUTION_ID=$(aws cloudformation describe-stacks --profile "$PROFILE" --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" --output text)

echo "Bucket: $BUCKET"
echo "Distribution: $DISTRIBUTION_ID"

# Hashed assets (assets/*.js, *.css) are immutable per build, safe to cache
# hard. index.html is NOT hashed, so it must always revalidate — otherwise
# browsers/CDN can keep serving a stale index.html pointing at old assets
# (or an old build's logic) even after a fresh deploy + invalidation.
aws s3 sync dist/ "s3://$BUCKET" --profile "$PROFILE" --region "$REGION" --delete \
  --exclude "index.html" --cache-control "public, max-age=31536000, immutable"

aws s3 cp dist/index.html "s3://$BUCKET/index.html" --profile "$PROFILE" --region "$REGION" \
  --cache-control "no-cache, no-store, must-revalidate" --content-type "text/html"

aws cloudfront create-invalidation --profile "$PROFILE" \
  --distribution-id "$DISTRIBUTION_ID" --paths "/*"

echo "Listo. La distribución de CloudFront puede tardar unos minutos en propagar los cambios."
