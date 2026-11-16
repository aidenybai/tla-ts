(*---
description: "The lexer reads \\* as a comment even after a set operand, so {1} \\* {2} is only {1}."
ref: "tla2sany/parser/TLAplusParserTokenManager.java#SkipLexicalActions"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE backslash_star_binds_longest ----
Test == {1} \* {2}
  = {1}
====

(*--- recorded
all:
  exit: 0
---*)
