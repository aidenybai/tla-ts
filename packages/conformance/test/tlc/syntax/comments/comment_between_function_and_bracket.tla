(*---
description: "A comment may sit between a function and its [ argument."
ref: "tla2sany/parser/TLAplusParserTokenManager.java#SkipLexicalActions"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE comment_between_function_and_bracket ----
Test == <<7>> (* c *) [1] = 7
====

(*--- recorded
all:
  exit: 0
---*)
