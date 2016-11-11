using System;
using System.Configuration;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.ServiceBus;
using Microsoft.ServiceBus.Messaging;


namespace ChatMessageProcessor
{
    // To learn more about Microsoft Azure WebJobs SDK, please see http://go.microsoft.com/fwlink/?LinkID=320976
    internal class Program
    {
        // Please set the following connection strings in app.config for this WebJob to run:
        // AzureWebJobsDashboard and AzureWebJobsStorage
        private static void Main()
        {
            var eventHubConnectionString = ConfigurationManager.AppSettings["eventHubConnectionString"];
            var eventHubName = ConfigurationManager.AppSettings["sourceEventHubName"];
            var storageAccountName = ConfigurationManager.AppSettings["storageAccountName"];
            var storageAccountKey = ConfigurationManager.AppSettings["storageAccountKey"];

            var storageConnectionString =
                $"DefaultEndpointsProtocol=https;AccountName={storageAccountName};AccountKey={storageAccountKey}";

            var eventHubConfig = new EventHubConfiguration();

            var eventProcessorHostName = Guid.NewGuid().ToString();
            var eventProcessorHost = new EventProcessorHost(eventProcessorHostName, eventHubName, 
                EventHubConsumerGroup.DefaultGroupName, eventHubConnectionString, storageConnectionString);

            eventHubConfig.AddEventProcessorHost(eventHubName, eventProcessorHost);

            var config = new JobHostConfiguration(storageConnectionString);
            config.UseEventHub(eventHubConfig);
            var host = new JobHost(config);

            Console.WriteLine("Registering EventProcessor...");

            var options = new EventProcessorOptions();
            options.ExceptionReceived += (sender, e) =>
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine(e.Exception);
                Console.ResetColor();
            };

            eventProcessorHost.RegisterEventProcessorAsync<SentimentEventProcessor>(options);

            // The following code ensures that the WebJob will be running continuously
            host.RunAndBlock();

            eventProcessorHost.UnregisterEventProcessorAsync().Wait();
        }
    }
}