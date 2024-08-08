import Foundation

let arguments = CommandLine.arguments

guard arguments.count == 4 else {
    print("Usage: updateField <taskid> <customfieldid> <asana_access_token>")
    exit(1)
}

let taskid = arguments[1]
let customfieldid = arguments[2]
let asanaAccessToken = arguments[3]

let parameters = ["data": ["custom_fields": [customfieldid: "123"]]] as [String: Any?]

let postData = try JSONSerialization.data(withJSONObject: parameters, options: [])

let url = URL(string: "https://app.asana.com/api/1.0/tasks/\(taskid)")!
var request = URLRequest(url: url)
request.httpMethod = "PUT"
request.timeoutInterval = 50
request.allHTTPHeaderFields = [
  "accept": "application/json",
  "content-type": "application/json",
  "authorization": "Bearer \(asanaAccessToken)"
]
request.httpBody = postData

let semaphore = DispatchSemaphore(value: 0)

let task = URLSession.shared.dataTask(with: request) { data, response, error in
    if let error = error {
        print("Error in Swift: \(error)")
        semaphore.signal()
        return
    }
    if let data = data {
        print(String(decoding: data, as: UTF8.self))
    }
    semaphore.signal()
}

task.resume()
semaphore.wait()
