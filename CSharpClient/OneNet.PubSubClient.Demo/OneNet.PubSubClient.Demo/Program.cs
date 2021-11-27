using System;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json;
using OneNet.PubSub.Client;
using OneNet.PubSub.Client.Models;

namespace OneNet.PubSubClient.Demo
{
    internal class Program
    {
        private const string Url = "http://localhost:5000";
        private const string UseName = "test-1";

        public static async Task Main(string[] args)
        {
            // Khai báo một connection.
            var pubSubConnection = new PubSubConnection(Url, UseName);

            // Khai báo lắng nghe các sự kiện: Có topic mới. Có handler mới.
            pubSubConnection.SetNewTopicHandler(OnNewTopic);
            pubSubConnection.SetCloseHandler(OnClose);

            // Bắt đầu kết nối
            await pubSubConnection.Start();

            // Tạo mới một kết nối
            await pubSubConnection.CreateTopic("topic-test", new TopicConfig()
            {
                IsUpdateOwnerConnection = true // Cho phép chuyển quyền sỡ hữu topic khi cùng một user.
            });

            // Tìm các topic hiện có
            var topics = await pubSubConnection.SearchTopic("topic-test");
            Console.WriteLine(JsonConvert.SerializeObject(topics));

            // Lắng nghe một topic mới
            await pubSubConnection.SubscribeTopic("topic-test", OnNewMessage);

            // Gửi tin nhắn tới topic
            while (true)
            {
                var data = Console.ReadLine();
                if (data == "exit")
                    break;
                await pubSubConnection.Publish("topic-test", data);
            }
        }

        /// <summary>
        /// Có một dữ liệu mới tới topic.
        /// </summary>
        /// <param name="topic"></param>
        /// <param name="data"></param>
        private static void OnNewMessage(string topic, object data)
        {
            Console.WriteLine(data.ToString());
        }

        /// <summary>
        /// Có một topic mới được tạo
        /// </summary>
        /// <param name="topic"></param>
        private static void OnNewTopic(Topic topic)
        {
            Console.WriteLine($"{nameof(OnNewTopic)}:{JsonConvert.SerializeObject(topic)}");
        }

        /// <summary>
        /// Connection bị đóng
        /// </summary>
        /// <param name="ex"></param>
        /// <returns></returns>
        private static Task OnClose(Exception ex)
        {
            Console.WriteLine(ex.Message);
            return Task.CompletedTask;
        }
    }
}