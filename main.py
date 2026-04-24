import os
import logging
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from supabase import create_client, Client

logging.basicConfig(
      format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
      level=logging.INFO
)
logger = logging.getLogger(__name__)

TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN')
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
      user = update.effective_user
      await update.message.reply_text(
          f'Ciao {user.first_name}! Sono il bot di Cashly. Usa /help per vedere i comandi disponibili.'
      )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
      help_text = (
                'Comandi disponibili:\n'
                '/start - Avvia il bot\n'
                '/help - Mostra questo messaggio\n'
                '/status - Controlla lo stato del bot\n'
      )
      await update.message.reply_text(help_text)


async def status(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
      try:
                response = supabase.table('users').select('count', count='exact').execute()
                await update.message.reply_text(f'Bot attivo! Connesso a Supabase.')
except Exception as e:
        logger.error(f'Errore Supabase: {e}')
        await update.message.reply_text('Bot attivo ma problema con Supabase.')


async def echo(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
      await update.message.reply_text(f'Hai scritto: {update.message.text}')


def main() -> None:
      application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    application.add_handler(CommandHandler('start', start))
    application.add_handler(CommandHandler('help', help_command))
    application.add_handler(CommandHandler('status', status))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, echo))

    logger.info('Bot avviato...')
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == '__main__':
      main()
  
