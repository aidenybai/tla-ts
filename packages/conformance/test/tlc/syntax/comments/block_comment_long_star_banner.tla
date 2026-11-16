(*---
description: A banner of stars opens and closes as one comment.
ref: "tla2sany/parser/TLAplusParserTokenManager.java#SkipLexicalActions"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE block_comment_long_star_banner ----
(*****************************)
(* Test == FALSE             *)
(*****************************)
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
