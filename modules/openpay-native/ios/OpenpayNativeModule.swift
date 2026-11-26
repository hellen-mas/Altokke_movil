import ExpoModulesCore
import OpenpayKit

public class OpenpayNativeModule: Module {

  public func definition() -> ModuleDefinition {

    Name("OpenpayNative")

    AsyncFunction("tokenizeCard") {
      (
        merchantId: String,
        publicKey: String,
        holderName: String,
        cardNumber: String,
        expirationMonth: String,
        expirationYear: String,
        cvv2: String
      ) async throws -> [String: String] in

      guard !merchantId.isEmpty, !publicKey.isEmpty else {
        throw NSError(
          domain: "OpenpayNative",
          code: 1001,
          userInfo: [
            NSLocalizedDescriptionKey: "Faltan las credenciales públicas de Openpay."
          ]
        )
      }

      guard !holderName.trimmingCharacters(in: .whitespaces).isEmpty,
            cardNumber.allSatisfy({ $0.isNumber }),
            cvv2.allSatisfy({ $0.isNumber }),
            let month = Int(expirationMonth),
            (1...12).contains(month),
            Int(expirationYear.suffix(2)) != nil else {

        throw NSError(
          domain: "OpenpayNative",
          code: 1002,
          userInfo: [
            NSLocalizedDescriptionKey: "Los datos de la tarjeta no son válidos."
          ]
        )
      }

      let openpay = Openpay(
        withMerchantId: merchantId,
        andApiKey: publicKey,
        isProductionMode: false,
        isDebug: false,
        countryCode: "PE"
      )

      // Obtener identificador antifraude.
      let deviceSessionId: String =
        try await withCheckedThrowingContinuation {
          (continuation: CheckedContinuation<String, Error>) in

          openpay.createDeviceSessionId(
            successFunction: { sessionID in
              continuation.resume(returning: sessionID)
            },
            failureFunction: { error in
              continuation.resume(throwing: error)
            }
          )
        }

      let card = TokenizeCardRequest(
        cardNumber: cardNumber,
        holderName: holderName,
        expirationYear: String(expirationYear.suffix(2)),
        expirationMonth: expirationMonth,
        cvv2: cvv2
      )

      // Generar token directamente con el SDK.
      let token: OPToken =
        try await withCheckedThrowingContinuation {
          (continuation: CheckedContinuation<OPToken, Error>) in

          openpay.tokenizeCard(card: card) { token in
            continuation.resume(returning: token)
          } failureFunction: { error in
            continuation.resume(throwing: error)
          }
        }

      return [
        "tokenId": token.id,
        "deviceSessionId": deviceSessionId
      ]
    }
  }
}