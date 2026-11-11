(*---
description: Evaluates a random bool expression, seed 262, number 801.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00801 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> (--1), b |-> (\E b1315 \in Nat : TRUE)]).a \in {b1316 \in ((SUBSET {1} \cap 2..1) \cap ({} \ {x \in 1..3 : x > 1})) : (SubSeq(<<1, 2>>, <<1>>, 2147483647) = (<<5, 6>> @@ (1 :> 2)))}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 28 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 25.
    | Expression starting at line 14, column 25.
    | Field Value starting at line 14, column 19.
    | Some [] Form starting at line 14, column 18.
    | ExtendableExpr starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_00801
    | In module random_00801
    | Could not parse module random_00801 from file random_00801.tla
    | *** Errors: 1
    | In module random_00801
    | Could not parse module random_00801 from file random_00801.tla
    3002:1 Parsing or semantic analysis failed.
---*)
