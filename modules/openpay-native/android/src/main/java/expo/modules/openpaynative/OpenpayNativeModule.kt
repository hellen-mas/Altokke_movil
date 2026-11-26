
package expo.modules.openpaynative

import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

import mx.openpay.android.Openpay
import mx.openpay.android.OpCountry
import mx.openpay.android.OperationCallBack
import mx.openpay.android.OperationResult
import mx.openpay.android.exceptions.OpenpayServiceException
import mx.openpay.android.exceptions.ServiceUnavailableException
import mx.openpay.android.model.Card
import mx.openpay.android.model.Token
import mx.openpay.android.validation.CardValidator

class OpenpayNativeModule : Module() {

  override fun definition() = ModuleDefinition {

    Name("OpenpayNative")

    AsyncFunction("tokenizeCard") {
      merchantId: String,
      publicKey: String,
      holderName: String,
      cardNumber: String,
      expirationMonth: String,
      expirationYear: String,
      cvv2: String,
      promise: Promise ->

      try {
        val activity = appContext.currentActivity
          ?: throw IllegalStateException(
            "Actividad Android no disponible."
          )

        val month = expirationMonth.toIntOrNull()
          ?: throw IllegalArgumentException("Mes inválido.")

        val year = expirationYear.takeLast(2).toIntOrNull()
          ?: throw IllegalArgumentException("Año inválido.")

        val number = cardNumber.filter { it.isDigit() }

        require(merchantId.isNotBlank() && publicKey.isNotBlank()) {
          "Faltan las credenciales públicas de Openpay."
        }

        require(holderName.isNotBlank()) {
          "Ingresa el nombre del titular."
        }

        require(CardValidator.validateHolderName(holderName)) {
          "Nombre del titular inválido."
        }

        require(CardValidator.validateNumber(number)) {
          "Número de tarjeta inválido."
        }

        require(CardValidator.validateCVV(cvv2, number)) {
          "Código de seguridad inválido."
        }

        require(CardValidator.validateExpiryDate(month, year)) {
          "Fecha de vencimiento inválida."
        }

        val openpay = Openpay(
          merchantId,
          publicKey,
          false,
          OpCountry.PE
        )

        val deviceSessionId =
          openpay.getDeviceCollectorDefaultImpl().setup(activity)

        require(!deviceSessionId.isNullOrBlank()) {
          "No se pudo obtener el identificador antifraude."
        }

        val card = Card().apply {
          this.holderName(holderName.trim())
          this.cardNumber(number)
          this.expirationMonth(month)
          this.expirationYear(year)
          this.cvv2(cvv2)
        }

        openpay.createToken(
          card,
          object : OperationCallBack<Token> {

            override fun onSuccess(
              result: OperationResult<Token>
            ) {
              val token = result.getResult()

              promise.resolve(
                mapOf(
                  "tokenId" to token.getId(),
                  "deviceSessionId" to deviceSessionId
                )
              )
            }

            override fun onError(
              error: OpenpayServiceException
            ) {
              promise.reject(
                "OPENPAY_ERROR",
                error.message ?: "Tarjeta rechazada.",
                error
              )
            }

            override fun onCommunicationError(
              error: ServiceUnavailableException
            ) {
              promise.reject(
                "OPENPAY_CONNECTION_ERROR",
                error.message ?: "Error de conexión con Openpay.",
                error
              )
            }
          }
        )

      } catch (error: Exception) {
        promise.reject(
          "OPENPAY_ERROR",
          error.message ?: "No se pudo procesar la tarjeta.",
          error
        )
      }
    }.runOnQueue(Queues.MAIN)
  }
}
