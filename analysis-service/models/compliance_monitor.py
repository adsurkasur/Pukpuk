"""
Compliance monitoring for fertilizer price verification
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime
import os

# Import Twilio (lazy loading)
twilio_available = True
try:
    from twilio.rest import Client
    from twilio.base.exceptions import TwilioException
except ImportError:
    twilio_available = False

logger = logging.getLogger(__name__)

class ComplianceMonitor:
    """Monitor fertilizer price compliance using WhatsApp verification"""

    def __init__(self):
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.whatsapp_number = os.getenv('TWILIO_WHATSAPP_NUMBER', '+14155238886')  # Twilio sandbox number

        if twilio_available and self.account_sid and self.auth_token:
            self.client = Client(self.account_sid, self.auth_token)
            logger.info("Twilio client initialized for compliance monitoring")
        else:
            self.client = None
            logger.warning("Twilio not configured - compliance monitoring disabled")

    def send_verification_request(self, farmer_phone: str, kiosk_name: str, transaction_details: Dict[str, Any]) -> bool:
        """
        Send WhatsApp verification request to farmer

        Args:
            farmer_phone: Farmer's phone number (with country code)
            kiosk_name: Name of the kiosk
            transaction_details: Details of the transaction

        Returns:
            True if message sent successfully
        """
        if not self.client:
            logger.warning("Twilio client not available - skipping verification")
            return False

        try:
            # Format transaction details
            items = transaction_details.get('items', [])
            total_amount = sum(item.get('quantity', 0) * item.get('price', 0) for item in items)

            message = f"""PUKPUK Price Verification

Dear Farmer,

We detected a fertilizer purchase at {kiosk_name} kiosk:
{chr(10).join([f"- {item.get('quantity', 0)} {item.get('unit', 'kg')} {item.get('name', 'Unknown')} @ Rp{item.get('price', 0):,}/kg" for item in items])}

Total: Rp{total_amount:,}

Maximum Retail Price (HET): Rp{transaction_details.get('het_price', 0):,}

Did you pay according to HET prices?

Reply YES or NO"""

            # Send WhatsApp message
            message_response = self.client.messages.create(
                from_=f'whatsapp:{self.whatsapp_number}',
                body=message,
                to=f'whatsapp:{farmer_phone}'
            )

            logger.info(f"Verification message sent to {farmer_phone}, SID: {message_response.sid}")
            return True

        except TwilioException as e:
            logger.error(f"Twilio error sending verification: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Error sending verification message: {str(e)}")
            return False

    def check_verification_response(self, farmer_phone: str, expected_response_window: int = 24) -> Optional[str]:
        """
        Check if farmer responded to verification request

        Args:
            farmer_phone: Farmer's phone number
            expected_response_window: Hours to wait for response

        Returns:
            'YES', 'NO', or None if no response
        """
        if not self.client:
            return None

        try:
            # Get recent messages from farmer
            messages = self.client.messages.list(
                from_=f'whatsapp:{farmer_phone}',
                to=f'whatsapp:{self.whatsapp_number}',
                limit=10
            )

            # Find most recent response
            for message in messages:
                # Check if message is recent (within response window)
                message_time = message.date_sent
                hours_diff = (datetime.utcnow() - message_time).total_seconds() / 3600

                if hours_diff <= expected_response_window:
                    response = message.body.strip().upper()
                    if response in ['YES', 'NO']:
                        logger.info(f"Verification response from {farmer_phone}: {response}")
                        return response

            return None

        except Exception as e:
            logger.error(f"Error checking verification response: {str(e)}")
            return None

    def flag_compliance_violation(self, kiosk_id: str, farmer_phone: str, transaction_details: Dict[str, Any]) -> Dict[str, Any]:
        """
        Flag a potential compliance violation

        Args:
            kiosk_id: Kiosk identifier
            farmer_phone: Farmer's phone number
            transaction_details: Transaction details

        Returns:
            Violation report
        """
        violation_report = {
            'kiosk_id': kiosk_id,
            'farmer_phone': farmer_phone,
            'transaction_details': transaction_details,
            'violation_type': 'price_violation',
            'detected_at': datetime.utcnow().isoformat(),
            'status': 'flagged',
            'severity': 'high'
        }

        logger.warning(f"Compliance violation flagged for kiosk {kiosk_id}")
        return violation_report

    def parse_chat_transaction(self, chat_message: str) -> Optional[Dict[str, Any]]:
        """
        Parse transaction details from kiosk chat message

        Args:
            chat_message: Raw chat message from kiosk

        Returns:
            Parsed transaction data or None if parsing failed
        """
        try:
            # Simple NLP parsing for transaction messages
            # Expected format: "Reporting admin, just sold X sacks of Urea and Y sacks of NPK to Mr. Budi"

            message = chat_message.lower()

            # Extract quantities and products
            items = []

            # Look for fertilizer types and quantities
            fertilizer_patterns = {
                'urea': ['urea', 'pupuk urea'],
                'npk': ['npk', 'pupuk npk'],
                'sp36': ['sp36', 'sp-36'],
                'za': ['za', 'pupuk za']
            }

            for fertilizer, patterns in fertilizer_patterns.items():
                for pattern in patterns:
                    if pattern in message:
                        # Try to extract quantity (simple regex would be better in production)
                        words = message.split()
                        for i, word in enumerate(words):
                            if word.isdigit() and i > 0:
                                try:
                                    quantity = int(word)
                                    unit = 'sack' if 'sack' in message else 'kg'
                                    items.append({
                                        'name': fertilizer.upper(),
                                        'quantity': quantity,
                                        'unit': unit,
                                        'price': 0  # To be filled from HET database
                                    })
                                    break
                                except ValueError:
                                    continue
                        break

            # Extract buyer name
            buyer_name = None
            if 'mr.' in message or 'mrs.' in message or 'ms.' in message:
                # Simple extraction
                name_start = message.find('mr.') or message.find('mrs.') or message.find('ms.')
                if name_start != -1:
                    name_part = message[name_start:].split()[0:2]  # First two words
                    buyer_name = ' '.join(name_part).title()

            if items:
                return {
                    'items': items,
                    'buyer_name': buyer_name,
                    'timestamp': datetime.utcnow().isoformat(),
                    'raw_message': chat_message
                }

            return None

        except Exception as e:
            logger.error(f"Error parsing chat transaction: {str(e)}")
            return None