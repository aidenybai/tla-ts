(*---
description: "\\* directly after an operator token with no space starts a comment."
ref: "tla2sany/parser/TLAplusParserTokenManager.java#SkipLexicalActions"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE line_comment_on_end_of_operator ----
Test == 1 =\* the rest is a comment
  1
====

(*--- recorded
all:
  exit: 0
---*)
