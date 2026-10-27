---- MODULE Format ----
EXTENDS Naturals, Sequences, TLC
VARIABLE x
Init == x = 0
Next == x' = x
r == [a |-> 1, b |-> 2]
ASSUME PrintT(<<"record", r>>)
ASSUME PrintT(<<"colon", "a" :> 1>>)
ASSUME PrintT(<<"colon-two", ("a" :> 1) @@ ("b" :> 2)>>)
ASSUME PrintT(<<"construct", [k \in {"a", "b"} |-> 1]>>)
ASSUME PrintT(<<"construct-odd", [k \in {"s:x", "b"} |-> 1]>>)
ASSUME PrintT(<<"colon-odd", "s:x" :> 1>>)
ASSUME PrintT(<<"except-record", [r EXCEPT !.a = 3]>>)
ASSUME PrintT(<<"except-function", [[k \in {"a"} |-> 1] EXCEPT !["a"] = 2]>>)
ASSUME PrintT(<<"record-set", CHOOSE e \in [a : {1}, b : {2}] : TRUE>>)
ASSUME PrintT(<<"merge-record", r @@ ("c" :> 3)>>)
ASSUME PrintT(<<"merge-into-record", ("c" :> 3) @@ r>>)
ASSUME PrintT(<<"tuple", <<1, 2>>, [i \in 1..2 |-> i]>>)
ASSUME PrintT(<<"int-colon", 1 :> "a", (1 :> "a") @@ (2 :> "b")>>)
ASSUME PrintT(<<"empty", [k \in {} |-> 1], <<>>>>)
ASSUME PrintT(<<"seq-append", Append(<<>>, 1)>>)
ASSUME PrintT(<<"model-domain", [k \in {TRUE} |-> 1]>>)
ASSUME PrintT(<<"record-in-set", {r}>>)
ASSUME PrintT(<<"equal", r = ("a" :> 1 @@ "b" :> 2)>>)
ASSUME PrintT(<<"set-of-colon", {("a" :> 1), [a |-> 1]}>>)
ASSUME PrintT(<<"tostring", ToString("a" :> 1), ToString(r)>>)
ASSUME PrintT(<<"except-colon-record", [("a" :> 1) EXCEPT !.a = 5]>>)
ASSUME PrintT(<<"domain-restrict", [k \in DOMAIN r |-> r[k]]>>)
====
