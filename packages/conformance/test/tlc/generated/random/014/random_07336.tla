(*---
description: Evaluates a random int expression, seed 262, number 7336.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07336 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head([SelectSeq(<<>>, LAMBDA e : e > 0) EXCEPT ![1] = (7 + 2)]) - (CHOOSE b11289 \in ({b11290 : b11290 \in 1..3} \cap UNION {{1}, {1}}) : {(b11289 \div -1) : b11291 \in ({2, 1, 3} \cap SUBSET {1})})))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 164 to line 14, col 167 of module random_07336 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 157.
    | Expression starting at line 14, column 157.
    | ExtendableExpr starting at line 14, column 156.
    | Expression starting at line 14, column 156.
    | Some { } form starting at line 14, column 155.
    | Fatal errors while parsing TLA+ spec in file random_07336
    | In module random_07336
    | Could not parse module random_07336 from file random_07336.tla
    | *** Errors: 1
    | In module random_07336
    | Could not parse module random_07336 from file random_07336.tla
    3002:1 Parsing or semantic analysis failed.
---*)
