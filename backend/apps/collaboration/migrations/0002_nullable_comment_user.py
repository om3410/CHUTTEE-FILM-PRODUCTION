from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('collaboration', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            sql='ALTER TABLE collab_comments ALTER COLUMN user_id DROP NOT NULL;',
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
