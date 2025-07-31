from transformers import PreTrainedTokenizerFast, BartForConditionalGeneration

model = BartForConditionalGeneration.from_pretrained("digit82/kobart-summarization")
tokenizer = PreTrainedTokenizerFast.from_pretrained("digit82/kobart-summarization")

def summarize_korean_sync(text: str) -> str:
    input_ids = tokenizer.encode(text, return_tensors="pt", max_length=1024, truncation=True)
    summary_ids = model.generate(input_ids, max_length=128, min_length=30, num_beams=4)
    return tokenizer.decode(summary_ids[0], skip_special_tokens=True) 