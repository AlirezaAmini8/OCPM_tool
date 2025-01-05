FROM docker.arvancloud.ir/python

WORKDIR /code

COPY requirements.txt /code/

RUN pip install -r requirements.txt

RUN pip install psycopg2-binary

COPY . /code/

CMD ["sh", "-c", "python manage.py makemigrations && \
                  python manage.py migrate && \
                  python manage.py runserver 0.0.0.0:8000"]