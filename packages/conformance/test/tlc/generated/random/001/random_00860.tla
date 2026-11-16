(*---
description: Evaluates a random set expression, seed 262, number 860.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00860 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> (2147483647 \div 1), b |-> SubSeq(<<1, 2>>, 2147483647, 0)]).a .. ([(CHOOSE f \in [{1, 2} \ {1} -> {1, 2} \cap {2}] : TRUE) EXCEPT ![(--1)] = UNION {{1, 2}, 1}] :> (CASE FALSE -> 2 [] OTHER -> 0 % (-0)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 161 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 158.
    | Expression starting at line 14, column 158.
    | Except Component starting at line 14, column 157.
    | Except Spec starting at line 14, column 156.
    | Some [] Form starting at line 14, column 92.
    | Fatal errors while parsing TLA+ spec in file random_00860
    | In module random_00860
    | Could not parse module random_00860 from file random_00860.tla
    | *** Errors: 1
    | In module random_00860
    | Could not parse module random_00860 from file random_00860.tla
    3002:1 Parsing or semantic analysis failed.
---*)
