# Use credentials from .env if available, otherwise prompt
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Try to get password from environment variable DB_PASSWORD
if [ -z "$DB_PASSWORD" ]; then
    # Fallback to DATABASE_URL parsing if needed, or just prompt
    mysql -u root -p -D PaisaScore --table
else
    mysql -u ${DB_USER:-root} -p$DB_PASSWORD -D ${DB_NAME:-PaisaScore} --table
fi
