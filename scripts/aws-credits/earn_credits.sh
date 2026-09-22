#!/usr/bin/env bash
set -e
PROFILE=hackathon
REGION=us-east-1

echo "== 1/3 EC2 =="
AMI_ID=$(aws ec2 describe-images --profile "$PROFILE" --region "$REGION" \
  --owners amazon \
  --filters "Name=name,Values=al2023-ami-2023.*-x86_64" "Name=state,Values=available" \
  --query "sort_by(Images,&CreationDate)[-1].ImageId" --output text)
echo "AMI: $AMI_ID"
aws ec2 run-instances --profile "$PROFILE" --region "$REGION" \
  --image-id "$AMI_ID" --instance-type t3.micro \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=hackathon-credit-activity}]' \
  --query "Instances[0].{ID:InstanceId,State:State.Name}" --output table

echo "== 2/3 Bedrock =="
aws bedrock-runtime invoke-model --profile "$PROFILE" --region "$REGION" \
  --model-id amazon.titan-text-lite-v1 \
  --body '{"inputText":"Hello","textGenerationConfig":{"maxTokenCount":20}}' \
  --cli-binary-format raw-in-base64-out output.json
cat output.json

echo "== 3/3 Lambda =="
echo 'def handler(event, context): return {"statusCode": 200, "body": "hello hackathon"}' > lambda_function.py
zip -q lambda.zip lambda_function.py
ROLE_ARN=$(aws iam create-role --profile "$PROFILE" --role-name hackathon-lambda-role \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}' \
  --query "Role.Arn" --output text)
aws iam attach-role-policy --profile "$PROFILE" --role-name hackathon-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
echo "Esperando propagación del rol IAM..."
sleep 10
aws lambda create-function --profile "$PROFILE" --region "$REGION" \
  --function-name hackathon-credit-activity --runtime python3.12 \
  --role "$ROLE_ARN" --handler lambda_function.handler --zip-file fileb://lambda.zip \
  --query "{Name:FunctionName,State:State}" --output table

echo "Listo. Revisa la página de 'Earn AWS credits' en unos minutos."
