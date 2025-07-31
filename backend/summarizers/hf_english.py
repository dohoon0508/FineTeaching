from transformers import BartTokenizer, BartForConditionalGeneration

model = BartForConditionalGeneration.from_pretrained("facebook/bart-large-cnn")
tokenizer = BartTokenizer.from_pretrained("facebook/bart-large-cnn")

def summarize_english_sync(text: str) -> str:
    inputs = tokenizer([text], return_tensors="pt", max_length=1024, truncation=True)
    summary_ids = model.generate(inputs["input_ids"], max_length=128, min_length=30, num_beams=4)
    return tokenizer.decode(summary_ids[0], skip_special_tokens=True) 