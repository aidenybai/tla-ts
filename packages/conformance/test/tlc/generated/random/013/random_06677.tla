(*---
description: Evaluates a random function expression, seed 262, number 6677.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06677 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(SelectSeq([FALSE EXCEPT ![1] = 2], LAMBDA e : e > 0)) :> CASE (\E b10238 \in ({2, 1, 3} \cup SUBSET {1}) : (2..1 = 3)) -> ((7 \div -1) % [b10239 \in 1..3 |-> 3]) [] OTHER -> (({2, 1, 3} \subseteq {}) - ([x \in 1..2 |-> x])[3])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 147 to line 14, col 150 of module random_06677 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 145.
    | Expression starting at line 14, column 145.
    | ExtendableExpr starting at line 14, column 144.
    | Expression starting at line 14, column 144.
    | ExtendableExpr starting at line 14, column 143.
    | Fatal errors while parsing TLA+ spec in file random_06677
    | In module random_06677
    | Could not parse module random_06677 from file random_06677.tla
    | *** Errors: 1
    | In module random_06677
    | Could not parse module random_06677 from file random_06677.tla
    3002:1 Parsing or semantic analysis failed.
---*)
