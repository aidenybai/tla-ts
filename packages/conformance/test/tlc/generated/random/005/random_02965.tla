(*---
description: Evaluates a random bool expression, seed 262, number 2965.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02965 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b4702 \in UNION {{b4703 : b4703 \in TRUE}, ({} \ {1, 2})} : (([a |-> 1, b |-> TRUE] - b4702) = (CHOOSE b4704 \in 1..3 : FALSE))) = Head(SubSeq(SubSeq(<<1, 2>>, 2, 2), (3 * -1), Cardinality(SUBSET {1})))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 195 to line 14, col 195 of module random_02965 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 193.
    | Expression starting at line 14, column 193.
    | ExtendableExpr starting at line 14, column 192.
    | Expression starting at line 14, column 192.
    | Optional Arguments starting at line 14, column 167.
    | Fatal errors while parsing TLA+ spec in file random_02965
    | In module random_02965
    | Could not parse module random_02965 from file random_02965.tla
    | *** Errors: 1
    | In module random_02965
    | Could not parse module random_02965 from file random_02965.tla
    3002:1 Parsing or semantic analysis failed.
---*)
