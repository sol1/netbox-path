from setuptools import find_packages, setup

setup(
    name='netbox_path',
    version='0.2.5',
    description='Create visual and queryable maps of logical paths within your infrastructure',
    install_requires=[],
    url='https://gitlab.sol1.net/SOL1/netbox-path',
    packages=find_packages(),
    include_package_data=True,
    zip_safe=False,
)
