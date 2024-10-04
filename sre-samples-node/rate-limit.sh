#!/bin/bash

url="http://ec2-54-160-129-142.compute-1.amazonaws.com:8080/api/ratelimit"
num_requests=155
total_time=60
interval=0.2 


send_request() {
 
  response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  
  if [[ "$response" -ge 200 && "$response" -lt 300 ]]; then
    echo "Requisição $1 enviada com sucesso (Status: $response)"
  else
    echo "Falha na requisição $1 (Status: $response)"
  fi
}

for ((i=1; i<=num_requests; i++))
do

  send_request "$i" &
  
  sleep "$interval"
done

wait

echo "155 reqs"