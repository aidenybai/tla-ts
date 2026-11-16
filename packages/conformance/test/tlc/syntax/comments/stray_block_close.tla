(*---
description: "*) outside a comment lexes as * then ), which is a parse error."
ref: "tla2sany/parser/TLAplusParserTokenManager.java#SkipLexicalActions"
features: [comments]
outcome: parse-error
---*)
---- MODULE stray_block_close ----
Test == TRUE *)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered ")" at line 8, column 15 and token "*" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 8, column 15.
    | ExtendableExpr starting at line 8, column 9.
    | Expression starting at line 8, column 9.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file stray_block_close
    | In module stray_block_close
    | Could not parse module stray_block_close from file stray_block_close.tla
    | *** Errors: 1
    | In module stray_block_close
    | Could not parse module stray_block_close from file stray_block_close.tla
    3002:1 Parsing or semantic analysis failed.
---*)
