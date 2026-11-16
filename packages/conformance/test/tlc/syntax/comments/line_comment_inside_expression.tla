(*---
description: "A \\* comment may sit between the operands of an expression."
ref: "tla2sany/parser/TLAplusParserTokenManager.java#SkipLexicalActions"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE line_comment_inside_expression ----
Test == 1 \* first operand
        = \* the operator
        1
====

(*--- recorded
all:
  exit: 0
---*)
