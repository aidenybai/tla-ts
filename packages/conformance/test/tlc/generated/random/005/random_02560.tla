(*---
description: Evaluates a random seq expression, seed 262, number 2560.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02560 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Append((Tail(<<>>) \o (<<1>> \o <<1, 2>>)), ((CHOOSE f \in [{} -> {1, 2} \cap {2}] : TRUE) \div ((1 :> 2) @@ [x \in 1..2 |-> x]))), ((CHOOSE b4034 \in {7, [a |-> 1]} : (0 \in 1..3)) - UNION {({} \cap FALSE), {1, -1}}), CASE (~[[a |-> 1] EXCEPT !.a = @ + 3]) -> ((-2147483647) % ([a |-> 1]).a) [] OTHER -> ((CHOOSE b4035 \in Nat : FALSE) + ({2, 1, 3} \div -1))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 373 to line 14, col 376 of module random_02560 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 363.
    | Expression starting at line 14, column 363.
    | ExtendableExpr starting at line 14, column 362.
    | ExtendableExpr starting at line 14, column 329.
    | Expression starting at line 14, column 329.
    | Fatal errors while parsing TLA+ spec in file random_02560
    | In module random_02560
    | Could not parse module random_02560 from file random_02560.tla
    | *** Errors: 1
    | In module random_02560
    | Could not parse module random_02560 from file random_02560.tla
    3002:1 Parsing or semantic analysis failed.
---*)
