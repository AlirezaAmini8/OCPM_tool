FROM python

RUN apt-get update && apt-get install -y --no-install-recommends \
    graphviz \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /code

COPY requirements.txt /code/

RUN pip install --no-cache-dir -r requirements.txt

RUN pip install psycopg2-binary

COPY . /code/

EXPOSE 8000

CMD ["sh", "-c", "python manage.py makemigrations && \
                python manage.py migrate && \
                python manage.py runserver 0.0.0.0:8000"]