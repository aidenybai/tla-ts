(*---
description: tlapm's own test fast/language/Subref_test.tla.
ref: test/fast/language/Subref_test.tla
features:
  - tlapm-test
mode: proof
outcome: incomplete
---*)
---- MODULE Subref_test ----

CONSTANTS  _ + _, _ - _

CONSTANTS A, B, C, P(_), Q(_, _), R(_, _, _), S, T, U

THEOREM ASSUME NEW x \in S, NEW y \in S, NEW z \in S,
               NEW j, NEW k, NEW l
        PROVE  TRUE
<1>. "simple positional references"
  <+>. "ordinary TLA+ operators"
    <+>. F == x + y
    <*>. F!<< = x
      OBVIOUS
    <*>. F!>> = y
      OBVIOUS
    <*>. QED OMITTED
  <*>. "if/then/else"
    <+>. F == IF j THEN k ELSE l
    <*>. /\ F!1 = j
         /\ F!2 = k
         /\ F!3 = l
      OBVIOUS
    <*>. QED OMITTED
  <*>. "expressions that introduce binders"
    <+>. F == \A a, b \in S, c, d \in T, e, f \in U : P(a) /\ Q(b, c) /\ R(d, e, f)
         G == { P(a) /\ Q(b, c) : a, b \in S, c \in T }
         H == [ a, b \in S, c, d \in T |-> P(a) /\ R(b, c, d) ]
    (* following steps salted to block the triviality checker *)
    <*>. F!1 = S /\ F!2 = T /\ F!3 = U (* salt *) /\ 1 = 1
      OBVIOUS
    <*>. G!1 = S /\ G!2 = T (* salt *) /\ 2 = 2
      OBVIOUS
    <*>. H!1 = S /\ H!2 = T (* salt *) /\ 3 = 3
      OBVIOUS
    <*>. F!(x, y, z, j, k, l) = (P(x) /\ Q(y, z) /\ R(j, k, l)) (* salt *) /\ 4 = 4
      OBVIOUS
    <*>. G!(x, y, z) = (P(x) /\ Q(y, z)) (* salt *) /\ 5 = 5
      OBVIOUS
    <*>. H!(x, y, z, j) = (P(x) /\ R(y, z, j)) (* salt *) /\ 6 = 6
      OBVIOUS
    <*>. I == CHOOSE a \in S : P(a)
         J == { a \in S : P(a) }
    (* following steps salted to block the triviality checker *)
    <*>. I!1 = S (* salt *) /\ 7 = 7
      OBVIOUS
    <*>. J!1 = S (* salt *) /\ 8 = 8
      OBVIOUS
    <*>. I!(10) = P(10) (* salt *) /\ 9 = 9
      OBVIOUS
    <*>. J!(10) = P(10) (* salt *) /\ 10 = 10
      OBVIOUS
    <*>. QED OMITTED
  <*>. "set enums, tuples, records, record sets"
    <+>. F == {x, y, z, j, k, l}
         G == <<x, y, z, j, k, l>>
         H == [f1 : x, f2 : y, f3 : z, f4 : j, f5 : k, f6 : l]
         I == [f1 |-> x, f2 |-> y, f3 |-> z, f4 |-> j, f5 |-> k, f6 |-> l]
    (* following steps salted to block the triviality checker *)
    <*>. F!1 = x /\ F!2 = y /\ F!3 = z /\ F!4 = j /\ F!5 = k /\ F!6 = l (* salt *) /\ 0 = 0
      OBVIOUS
    <*>. G!1 = x /\ G!2 = y /\ G!3 = z /\ G!4 = j /\ G!5 = k /\ G!6 = l (* salt *) /\ 1 = 1
      OBVIOUS
    <*>. H!1 = x /\ H!2 = y /\ H!3 = z /\ H!4 = j /\ H!5 = k /\ H!6 = l (* salt *) /\ 2 = 2
      OBVIOUS
    <*>. I!1 = x /\ I!2 = y /\ I!3 = z /\ I!4 = j /\ I!5 = k /\ I!6 = l (* salt *) /\ 3 = 3
      OBVIOUS
    <*>. QED OMITTED
  <*>. "LET expressions"
    <+>. F == LET G == x + y
                  H(u) == G + u
               IN H(10) - G
    (* following steps salted to block the triviality checker *)
    <*>. F!1 = (x + y + 10) - (x + y) (* salt *) /\ 1 = 1
      OBVIOUS
    <*>. F!: = F (* salt *) /\ 2 = 2
      OBVIOUS
    <*>. F!:!G = x + y (* salt *) /\ 2 = 2
      OBVIOUS
    <*>. (F!:!H(10) = LET G == x + y
                      IN  G + 10) (* salt *) /\ 3 = 3
      OBVIOUS
    <*>. QED OMITTED
  <*>. QED OMITTED
<*>. "positional selectors for ASSUME/PROVE"
  (* test cases to be written *)
  <+>. QED OMITTED
<*>. "labelled selectors"
  <+>. "example from page 9 of tla2.pdf of October 14, 2009"
    <+>. F(a) == \A b : l1(b):: P(a) =>
                           /\ Q(a, b)
                           /\ l2::\E c : /\ R(a, 10, b)
                                         /\ \E d : l3(c, d)::Q(a - b, c - d)
    <*>. F(x)!l1(y)!l2!l3(z,j) = Q(x - y, z - j)
      OBVIOUS
    <*>. G(a) == \A b : l1(b):: P(a) =>
                           /\ Q(a, b)
                           /\ l2::\E c : /\ R(a, 10, b)
                                         /\ \E d : l3(d, c)::Q(a - b, c - d)
    <*>. G(x)!l1(y)!l2!l3(z,j) = Q(x - y, j - z)
      OBVIOUS
    <*>. QED OMITTED
  <*>. "corner cases"
    <+>. "labelled subexpr. in scope of definitions"
      <+>. F == \A a, b : LET G == a + b
                          IN  l1(a, b)::G - 10
      <*>. F!l1(10,20) = LET G == 10 + 20
                         IN  G - 10
        OBVIOUS
      <*>. QED OMITTED
    <*>. "as above, but label arguments non-trivially permuted"
      <+>. F == \A a, b : LET G == a + b
                          IN  l1(b, a)::G - 10
      <*>. F!l1(10,20) = (LET G == 20 + 10 \* note change in order due to
                                           \* permutation in label args
                          IN  G - 10)
        OBVIOUS
      <*>. QED OMITTED
    <*>. QED OMITTED
  <*>. QED OMITTED
<*>. QED OMITTED

====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 4
    @loc: 22:7:22:14
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 22:7:22:14
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 5
    @loc: 24:7:24:14
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 24:7:24:14
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 7
    @loc: 31:7:31:14
    @status: to be proved

    @type: obligation
    @id: 7
    @loc: 31:7:31:14
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 9
    @loc: 39:7:39:14
    @status: to be proved

    @type: obligation
    @id: 9
    @loc: 39:7:39:14
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 10
    @loc: 41:7:41:14
    @status: to be proved

    @type: obligation
    @id: 10
    @loc: 41:7:41:14
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 11
    @loc: 43:7:43:14
    @status: to be proved

    @type: obligation
    @id: 11
    @loc: 43:7:43:14
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 12
    @loc: 45:7:45:14
    @status: to be proved

    @type: obligation
    @id: 12
    @loc: 45:7:45:14
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 13
    @loc: 47:7:47:14
    @status: to be proved

    @type: obligation
    @id: 13
    @loc: 47:7:47:14
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 14
    @loc: 49:7:49:14
    @status: to be proved

    @type: obligation
    @id: 14
    @loc: 49:7:49:14
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 15
    @loc: 54:7:54:14
    @status: to be proved

    @type: obligation
    @id: 15
    @loc: 54:7:54:14
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 16
    @loc: 56:7:56:14
    @status: to be proved

    @type: obligation
    @id: 16
    @loc: 56:7:56:14
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 17
    @loc: 58:7:58:14
    @status: to be proved

    @type: obligation
    @id: 17
    @loc: 58:7:58:14
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 18
    @loc: 60:7:60:14
    @status: to be proved

    @type: obligation
    @id: 18
    @loc: 60:7:60:14
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 20
    @loc: 69:7:69:14
    @status: to be proved

    @type: obligation
    @id: 20
    @loc: 69:7:69:14
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 21
    @loc: 71:7:71:14
    @status: to be proved

    @type: obligation
    @id: 21
    @loc: 71:7:71:14
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 22
    @loc: 73:7:73:14
    @status: to be proved

    @type: obligation
    @id: 22
    @loc: 73:7:73:14
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 23
    @loc: 75:7:75:14
    @status: to be proved

    @type: obligation
    @id: 23
    @loc: 75:7:75:14
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 25
    @loc: 83:7:83:14
    @status: to be proved

    @type: obligation
    @id: 25
    @loc: 83:7:83:14
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 26
    @loc: 85:7:85:14
    @status: to be proved

    @type: obligation
    @id: 26
    @loc: 85:7:85:14
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 27
    @loc: 87:7:87:14
    @status: to be proved

    @type: obligation
    @id: 27
    @loc: 87:7:87:14
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 28
    @loc: 90:7:90:14
    @status: to be proved

    @type: obligation
    @id: 28
    @loc: 90:7:90:14
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 32
    @loc: 103:7:103:14
    @status: to be proved

    @type: obligation
    @id: 32
    @loc: 103:7:103:14
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 33
    @loc: 109:7:109:14
    @status: to be proved

    @type: obligation
    @id: 33
    @loc: 109:7:109:14
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 36
    @loc: 117:9:117:16
    @status: to be proved

    @type: obligation
    @id: 36
    @loc: 117:9:117:16
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 38
    @loc: 125:9:125:16
    @status: to be proved

    @type: obligation
    @id: 38
    @loc: 125:9:125:16
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 25

    Omitted proof at File "./Subref_test.tla", line 25, characters 14-20
    Omitted proof at File "./Subref_test.tla", line 32, characters 14-20
    Omitted proof at File "./Subref_test.tla", line 61, characters 14-20
    Omitted proof at File "./Subref_test.tla", line 76, characters 14-20
    Omitted proof at File "./Subref_test.tla", line 91, characters 14-20
    Omitted proof at File "./Subref_test.tla", line 92, characters 12-18
    Omitted proof at File "./Subref_test.tla", line 95, characters 12-18
    Omitted proof at File "./Subref_test.tla", line 110, characters 14-20
    Omitted proof at File "./Subref_test.tla", line 118, characters 16-22
    Omitted proof at File "./Subref_test.tla", line 126, characters 16-22
    Omitted proof at File "./Subref_test.tla", line 127, characters 14-20
    Omitted proof at File "./Subref_test.tla", line 128, characters 12-18
    Omitted proof at File "./Subref_test.tla", line 129, characters 10-16
    File "./Subref_test.tla", line 9, character 1 to line 131, character 4:
    [ERROR]: Proof incomplete in module "Subref_test": 0 missing, 13 omitted proof step(s).
    File "./Subref_test.tla", line 9, character 1 to line 131, character 4:
    [INFO]: All 25 obligations proved.
---*)
