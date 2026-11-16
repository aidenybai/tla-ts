(*---
description: "A \\* comment may directly precede the module end line."
ref: "tla2sany/parser/TLAplusParserTokenManager.java#SkipLexicalActions"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE line_comment_at_last_line_before_end ----
Test == TRUE
\* last words
====

(*--- recorded
all:
  exit: 0
---*)
