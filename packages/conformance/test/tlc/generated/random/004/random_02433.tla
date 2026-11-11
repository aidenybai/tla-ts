(*---
description: Evaluates a random set expression, seed 262, number 2433.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02433 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({CASE TRUE -> 7 [] OTHER -> 0, (--1)} \ SubSeq((CHOOSE b3841 \in {1, 2} : TRUE), Len(<<1>>), ((1 :> 2))[3])) \cap ((Cardinality({2, 1, 3}) - IF FALSE THEN 2147483647 ELSE 3) .. (CHOOSE b3842 \in {1 : b3843 \in {}} : [[a |-> 1] EXCEPT !.a = @ + FALSE]))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 52 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 49.
    | Expression starting at line 14, column 49.
    | Some { } form starting at line 14, column 18.
    | ExtendableExpr starting at line 14, column 18.
    | Expression starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_02433
    | In module random_02433
    | Could not parse module random_02433 from file random_02433.tla
    | *** Errors: 1
    | In module random_02433
    | Could not parse module random_02433 from file random_02433.tla
    3002:1 Parsing or semantic analysis failed.
---*)
