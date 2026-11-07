(*---
description: "ℕ lexes as an identifier, so it does not mean Nat from Naturals."
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
outcome: parse-error
---*)
---- MODULE nat_symbol_not_nat ----
EXTENDS Naturals
Test == 1 ∈ ℕ
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 13 to line 9, col 13 of module nat_symbol_not_nat
    | Unknown operator: `ℕ'.
    3002:1 Parsing or semantic analysis failed.
---*)
