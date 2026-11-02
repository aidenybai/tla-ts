---- MODULE TrafficLight ----
VARIABLE color

Init == color = "red"
Next == \/ color = "red" /\ color' = "green"
        \/ color = "green" /\ color' = "yellow"
        \/ color = "yellow" /\ color' = "red"

Spec == Init /\ [][Next]_color

EventuallyGreen == <>(color = "green")
====
