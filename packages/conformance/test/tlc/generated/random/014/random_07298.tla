(*---
description: Evaluates a random seq expression, seed 262, number 7298.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07298 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SelectSeq(SubSeq(<<1, -1>>, (-7), (-1 * 0)), LAMBDA e : e > 0), (CHOOSE b11240 \in UNION {{7, 7}, (Nat \cup {x \in 1..3 : x > 1})} : (({} = SUBSET {1}) = {b11241 : b11241 \in 1..3})), (CHOOSE b11242 \in {(2 \div -1), ([x \in Nat |-> x + 1])[3]} : ((CHOOSE b11243 \in {1, 2} : FALSE) < (b11242 \div 1)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 230 to line 14, col 233 of module random_07298 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 228.
    | Expression starting at line 14, column 228.
    | ExtendableExpr starting at line 14, column 227.
    | Expression starting at line 14, column 227.
    | Some { } form starting at line 14, column 226.
    | Fatal errors while parsing TLA+ spec in file random_07298
    | In module random_07298
    | Could not parse module random_07298 from file random_07298.tla
    | *** Errors: 1
    | In module random_07298
    | Could not parse module random_07298 from file random_07298.tla
    3002:1 Parsing or semantic analysis failed.
---*)
