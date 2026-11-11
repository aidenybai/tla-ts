(*---
description: Evaluates a random set expression, seed 262, number 5617.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05617 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {((-1 .. 2) \cup {2 : b8690 \in 2..1}), UNION {DOMAIN <<5, 6>>, DOMAIN (1 :> 2)}} \ ({(0 \div 1), (0 \div -1)} \cap ((1 - 3) .. (TRUE + 2)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 124 to line 14, col 127 of module random_05617 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 122.
    | Expression starting at line 14, column 122.
    | ExtendableExpr starting at line 14, column 121.
    | Expression starting at line 14, column 121.
    | Some { } form starting at line 14, column 108.
    | Fatal errors while parsing TLA+ spec in file random_05617
    | In module random_05617
    | Could not parse module random_05617 from file random_05617.tla
    | *** Errors: 1
    | In module random_05617
    | Could not parse module random_05617 from file random_05617.tla
    3002:1 Parsing or semantic analysis failed.
---*)
