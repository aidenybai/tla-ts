(*---
description: Evaluates a random record expression, seed 262, number 2001.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02001 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (IF (CHOOSE b3168 \in {1} : FALSE) THEN (2 :> {2, 1, 3}) ELSE IF TRUE THEN 7 ELSE 7 \div (Len(<<1, 2>>) % (2 * -1))), b |-> ((\E b3169 \in UNION {1..3, SUBSET {1}} : (FALSE => FALSE)) <=> ({-1, -1} \subseteq {b3170 \in {} : FALSE}))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 132 to line 14, col 132 of module random_02001 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 130.
    | Expression starting at line 14, column 130.
    | ExtendableExpr starting at line 14, column 129.
    | ExtendableExpr starting at line 14, column 113.
    | Expression starting at line 14, column 113.
    | Fatal errors while parsing TLA+ spec in file random_02001
    | In module random_02001
    | Could not parse module random_02001 from file random_02001.tla
    | *** Errors: 1
    | In module random_02001
    | Could not parse module random_02001 from file random_02001.tla
    3002:1 Parsing or semantic analysis failed.
---*)
