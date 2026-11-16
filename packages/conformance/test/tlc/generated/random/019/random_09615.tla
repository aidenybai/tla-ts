(*---
description: Evaluates a random bool expression, seed 262, number 9615.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09615 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\A b14930 \in ((CHOOSE f \in [{1, 2} -> {2, 1, 3}] : TRUE) \cap ({1} \cap SUBSET {1})) : [[(1 :> 2) EXCEPT !.a = @ + b14930] EXCEPT !.a = @ + Len(<<>>)]) <=> (Head([<<1, 2>> EXCEPT ![1] = 2147483647]) \in (UNION {[x \in Nat |-> x + 1], 1..3} \cap (--1)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 268 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 265.
    | ExtendableExpr starting at line 14, column 230.
    | Expression starting at line 14, column 224.
    | ExtendableExpr starting at line 14, column 223.
    | ExtendableExpr starting at line 14, column 177.
    | Fatal errors while parsing TLA+ spec in file random_09615
    | In module random_09615
    | Could not parse module random_09615 from file random_09615.tla
    | *** Errors: 1
    | In module random_09615
    | Could not parse module random_09615 from file random_09615.tla
    3002:1 Parsing or semantic analysis failed.
---*)
