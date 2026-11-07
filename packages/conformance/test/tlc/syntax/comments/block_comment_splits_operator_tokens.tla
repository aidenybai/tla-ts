(*---
description: "A comment after a bare backslash leaves set difference, so the following name is not joined into a backslash operator."
ref: "tla2sany/parser/TLAplusParserTokenManager.java#SkipLexicalActions"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE block_comment_splits_operator_tokens ----
in == {1}
Test == ({1, 2} \ (* x *) in) = {2}
====

(*--- recorded
all:
  exit: 0
---*)
