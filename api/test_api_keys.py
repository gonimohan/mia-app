import os
import asyncio
import aiohttp
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_api_key(name, url, headers=None, params=None):
    """Test if an API key is working"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, params=params, timeout=10) as response:
                if response.status == 200:
                    print(f"✅ {name}: API key is working")
                    return True
                else:
                    print(f"❌ {name}: API key failed (Status: {response.status})")
                    return False
    except Exception as e:
        print(f"❌ {name}: Connection failed - {str(e)}")
        return False

async def test_all_apis():
    """Test all API keys"""
    print("🔑 Testing API Keys...\n")
    
    results = {}
    
    # Test NewsAPI
    if os.getenv("NEWS_API_KEY"):
        results["NewsAPI"] = await test_api_key(
            "NewsAPI",
            "https://newsapi.org/v2/top-headlines",
            params={"country": "us", "pageSize": 1, "apiKey": os.getenv("NEWS_API_KEY")}
        )
    else:
        print("⚠️  NewsAPI: No API key found")
    
    # Test MediaStack
    if os.getenv("MEDIASTACK_API_KEY"):
        results["MediaStack"] = await test_api_key(
            "MediaStack",
            "http://api.mediastack.com/v1/news",
            params={"access_key": os.getenv("MEDIASTACK_API_KEY"), "limit": 1}
        )
    else:
        print("⚠️  MediaStack: No API key found")
    
    # Test GNews
    if os.getenv("GNEWS_API_KEY"):
        results["GNews"] = await test_api_key(
            "GNews",
            "https://gnews.io/api/v4/top-headlines",
            params={"token": os.getenv("GNEWS_API_KEY"), "lang": "en", "max": 1}
        )
    else:
        print("⚠️  GNews: No API key found")
    
    # Test Alpha Vantage
    if os.getenv("ALPHA_VANTAGE_API_KEY"):
        results["Alpha Vantage"] = await test_api_key(
            "Alpha Vantage",
            "https://www.alphavantage.co/query",
            params={
                "function": "GLOBAL_QUOTE",
                "symbol": "AAPL",
                "apikey": os.getenv("ALPHA_VANTAGE_API_KEY")
            }
        )
    else:
        print("⚠️  Alpha Vantage: No API key found")
    
    # Test Financial Modeling Prep
    if os.getenv("FINANCIAL_MODELING_PREP_API_KEY"):
        results["Financial Modeling Prep"] = await test_api_key(
            "Financial Modeling Prep",
            f"https://financialmodelingprep.com/api/v3/quote/AAPL",
            params={"apikey": os.getenv("FINANCIAL_MODELING_PREP_API_KEY")}
        )
    else:
        print("⚠️  Financial Modeling Prep: No API key found")
    
    # Test SerpAPI
    if os.getenv("SERPAPI_API_KEY"):
        results["SerpAPI"] = await test_api_key(
            "SerpAPI",
            "https://serpapi.com/search",
            params={
                "q": "test",
                "api_key": os.getenv("SERPAPI_API_KEY"),
                "engine": "google",
                "num": 1
            }
        )
    else:
        print("⚠️  SerpAPI: No API key found")
    
    # Summary
    print(f"\n📊 Summary:")
    working = sum(1 for status in results.values() if status)
    total = len(results)
    print(f"✅ Working APIs: {working}/{total}")
    
    if working == total:
        print("🎉 All API keys are configured and working!")
    else:
        print("⚠️  Some API keys need attention. Check the failed ones above.")
    
    return results

if __name__ == "__main__":
    asyncio.run(test_all_apis())
