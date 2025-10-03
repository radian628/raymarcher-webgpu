declare module "compute.wgsl" {
  const data: {
  "bindGroups": [
    [
      {
        "name": "tex",
        "type": {
          "name": "texture_storage_2d",
          "attributes": [
            {
              "id": 23485,
              "line": 12,
              "name": "group",
              "value": "0"
            },
            {
              "id": 23486,
              "line": 12,
              "name": "binding",
              "value": "0"
            }
          ],
          "size": 0,
          "format": {
            "name": "rgba8unorm",
            "attributes": null,
            "size": 0
          },
          "access": "write"
        },
        "group": 0,
        "binding": 0,
        "attributes": [
          {
            "id": 23485,
            "line": 12,
            "name": "group",
            "value": "0"
          },
          {
            "id": 23486,
            "line": 12,
            "name": "binding",
            "value": "0"
          }
        ],
        "resourceType": 4,
        "access": "read"
      },
      {
        "name": "params",
        "type": {
          "name": "Params",
          "attributes": null,
          "size": 160,
          "members": [
            {
              "name": "size",
              "type": {
                "name": "vec2",
                "attributes": null,
                "size": 8,
                "format": {
                  "name": "u32",
                  "attributes": null,
                  "size": 4
                },
                "access": null
              },
              "attributes": null,
              "offset": 0,
              "size": 8
            },
            {
              "name": "b",
              "type": {
                "name": "B",
                "attributes": null,
                "size": 64,
                "members": [
                  {
                    "name": "test",
                    "type": {
                      "name": "array",
                      "attributes": null,
                      "size": 64,
                      "count": 4,
                      "stride": 16,
                      "format": {
                        "name": "vec4u",
                        "attributes": null,
                        "size": 16
                      }
                    },
                    "attributes": null,
                    "offset": 0,
                    "size": 64
                  }
                ],
                "align": 16,
                "startLine": 1,
                "endLine": 3,
                "inUse": true
              },
              "attributes": [
                {
                  "id": 23476,
                  "line": 7,
                  "name": "align",
                  "value": "16"
                }
              ],
              "offset": 16,
              "size": 64
            },
            {
              "name": "deeznuts",
              "type": {
                "name": "vec4",
                "attributes": null,
                "size": 16,
                "format": {
                  "name": "f32",
                  "attributes": null,
                  "size": 4
                },
                "access": null
              },
              "attributes": null,
              "offset": 80,
              "size": 16
            },
            {
              "name": "mvp",
              "type": {
                "name": "mat4x4",
                "attributes": null,
                "size": 64,
                "format": {
                  "name": "f32",
                  "attributes": null,
                  "size": 4
                },
                "access": null
              },
              "attributes": null,
              "offset": 96,
              "size": 64
            }
          ],
          "align": 16,
          "startLine": 5,
          "endLine": 10,
          "inUse": true
        },
        "group": 0,
        "binding": 1,
        "attributes": [
          {
            "id": 23489,
            "line": 13,
            "name": "group",
            "value": "0"
          },
          {
            "id": 23490,
            "line": 13,
            "name": "binding",
            "value": "1"
          }
        ],
        "resourceType": 0,
        "access": "read"
      }
    ]
  ]
};
 export default data; 
}