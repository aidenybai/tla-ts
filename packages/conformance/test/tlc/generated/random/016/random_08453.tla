(*---
description: Evaluates a random bool expression, seed 262, number 8453.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08453 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((3 * -1) \in DOMAIN <<5, 6>>) * (Cardinality([x \in Nat |-> x + 1]) - (3 - 2147483647))) \in UNION {UNION {(<<1, 2>> .. 0), ({x \in 1..3 : x > 1} \cap SUBSET {1})}, (IF TRUE THEN 1 ELSE 7 .. (2147483647 + 3))}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 22 to line 14, col 22 of module random_08453 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 20.
    | Expression starting at line 14, column 20.
    | ExtendableExpr starting at line 14, column 19.
    | Expression starting at line 14, column 19.
    | ExtendableExpr starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_08453
    | In module random_08453
    | Could not parse module random_08453 from file random_08453.tla
    | *** Errors: 1
    | In module random_08453
    | Could not parse module random_08453 from file random_08453.tla
    3002:1 Parsing or semantic analysis failed.
---*)
