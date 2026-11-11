(*---
description: Evaluates a random bool expression, seed 262, number 1708.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01708 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({(2 \div -1), Cardinality({1, 2})} \subseteq ({1, 1} \cap (1..3 \cup {1, 2}))) => (((-1 :> -1) @@ ({1, 2} \cap 1..3)) <=> ((\A b2726 \in <<3, 1, 2>> : TRUE) => ({x \in 1..3 : x > 1} \subseteq 2..1)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 22 to line 14, col 25 of module random_01708 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 20.
    | Expression starting at line 14, column 20.
    | ExtendableExpr starting at line 14, column 19.
    | Expression starting at line 14, column 19.
    | Some { } form starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_01708
    | In module random_01708
    | Could not parse module random_01708 from file random_01708.tla
    | *** Errors: 1
    | In module random_01708
    | Could not parse module random_01708 from file random_01708.tla
    3002:1 Parsing or semantic analysis failed.
---*)
