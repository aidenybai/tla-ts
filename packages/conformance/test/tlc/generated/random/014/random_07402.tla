(*---
description: Evaluates a random bool expression, seed 262, number 7402.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07402 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b11400 \in ({1, 2} \cup -1) : (\E b11401 \in {2, 1, 3} : FALSE)) + LET b11402 == (3 * -1) IN (1 \div b11402)) \in (([a |-> 1, b |-> TRUE]).a .. (CHOOSE b11403 \in (Nat \ TRUE) : (b11403 = b11403)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 110 to line 14, col 110 of module random_07402 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 108.
    | Expression starting at line 14, column 108.
    | ExtendableExpr starting at line 14, column 107.
    | Expression starting at line 14, column 107.
    | Definition starting at line 14, column 97.
    | Fatal errors while parsing TLA+ spec in file random_07402
    | In module random_07402
    | Could not parse module random_07402 from file random_07402.tla
    | *** Errors: 1
    | In module random_07402
    | Could not parse module random_07402 from file random_07402.tla
    3002:1 Parsing or semantic analysis failed.
---*)
